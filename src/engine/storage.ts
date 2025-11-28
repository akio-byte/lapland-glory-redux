import { GameState } from '../types.js';

const STORAGE_KEY = 'lapland_save_v1';

export const saveGame = (state: GameState) => {
  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    console.error('Pelin tallennus epäonnistui.', error);
  }
};

export const loadGame = (): GameState | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    return JSON.parse(raw) as GameState;
  } catch (error) {
    console.error('Tallennuksen lataus epäonnistui.', error);
    return null;
  }
};

export const clearSavedGame = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Tallennuksen tyhjennys epäonnistui.', error);
  }
};
