import { GameState } from '../types.js';
import { pickOne, randomInt } from '../utils/rng.js';

export type WorldPhase = 'early' | 'mid' | 'late';

export const getWorldPhase = (day: number): WorldPhase => {
  if (day <= 5) return 'early';
  if (day <= 20) return 'mid';
  return 'late';
};

export const decorateEventDescription = (base: string, state: GameState): string => {
  const worldPhase = getWorldPhase(state.time.day);
  const suffixes: Record<WorldPhase, string> = {
    early: 'Kadun varret ovat vielä tuttuja, vaikka pakkanen tihenee.',
    mid: 'Likainen lumi ja välkkyvät loisteputket kertovat väsyneestä kaupungista.',
    late: 'Kaupunki tuntuu kääntyvän sinua vastaan, kylmyys puhuu jokaisesta nurkasta.',
  };

  // Invisible progression: descriptions gain harsher detail as days pass.
  return `${base} ${suffixes[worldPhase]}`.trim();
};

export const adaptChoiceLabel = (base: string, state: GameState): string => {
  const { energy, sanity } = state.resources;
  const vitality = (energy + sanity) / 2;

  if (vitality < 30) {
    return `Haparoiden: ${base.toLowerCase()}`;
  }

  if (vitality > 70) {
    return `Päätät varmasti: ${base}`;
  }

  return base;
};

const distortionMap: Record<string, string> = {
  a: '@',
  e: '3',
  i: '1',
  o: '0',
  s: '$',
};

const distortWord = (word: string): string => {
  const candidates = [...word]
    .map((char, index) => ({ char: char.toLowerCase(), index }))
    .filter(({ char }) => distortionMap[char]);

  if (candidates.length === 0) return word;

  const { index, char } = pickOne(candidates) ?? candidates[0];
  return `${word.slice(0, index)}${distortionMap[char]}${word.slice(index + 1)}`;
};

export const maybeDistortText = (text: string, anomaly: number): string => {
  if (anomaly < 30) return text;

  const isHigh = anomaly > 60;
  const chance = isHigh ? 0.35 : 0.15;
  if (Math.random() > chance) return text;

  const words = text.split(' ');
  if (words.length === 0) return text;

  const targetIndex = randomInt(words.length);
  const target = words[targetIndex];
  if (!target) return text;

  // Anomaly-based text distortion happens here; rare and cosmetic only.
  if (isHigh && Math.random() < 0.4) {
    words.splice(targetIndex, 0, target);
    return words.join(' ');
  }

  words[targetIndex] = distortWord(target);
  return words.join(' ');
};
