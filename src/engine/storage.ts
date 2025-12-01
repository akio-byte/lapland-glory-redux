import { GameState } from '../types.js';

const STORAGE_KEY = 'lapland_save_v1';

const getLocalStorageSafe = (): Storage | null => {
  if (typeof window === 'undefined') return null;

  try {
    const { localStorage } = window;
    const probeKey = '__lapland_probe__';
    localStorage.setItem(probeKey, 'ok');
    localStorage.removeItem(probeKey);
    return localStorage;
  } catch (error) {
    console.warn('localStorage unavailable, skip persistence.', error);
    return null;
  }
};

export const saveGame = (state: GameState) => {
  const storage = getLocalStorageSafe();
  if (!storage) return;

  try {
    const serialized = JSON.stringify(state);
    storage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    console.warn('Pelin tallennus epäonnistui.', error);
  }
};

export const loadGame = (): GameState | null => {
  const storage = getLocalStorageSafe();
  if (!storage) return null;

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;

    return JSON.parse(raw) as GameState;
  } catch (error) {
    console.warn('Tallennuksen lataus epäonnistui.', error);
    return null;
  }
};

export const clearSavedGame = () => {
  const storage = getLocalStorageSafe();
  if (!storage) return;

  try {
    storage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Tallennuksen tyhjennys epäonnistui.', error);
  }
};
