import { useCallback, useEffect } from 'react';
import { SoundEffect, playSound, setMuted } from '../engine/sound.js';

export const useSound = (muted: boolean) => {
  useEffect(() => {
    setMuted(muted);
  }, [muted]);

  const play = useCallback((effect: SoundEffect) => {
    playSound(effect);
  }, []);

  return { play, muted };
};

export type PlaySound = (effect: SoundEffect) => void;
