import { useEffect, useState } from 'react';
import { getSubliminalWord } from '../narrative/subliminal.js';
import { Phase } from '../types.js';

type Props = {
  anomaly: number;
  phase: Phase;
};

export const SubliminalWhisper = ({ anomaly, phase }: Props) => {
  const [word, setWord] = useState<string | null>(null);

  useEffect(() => {
    const nextWord = getSubliminalWord(anomaly);
    if (!nextWord) {
      setWord(null);
      return;
    }

    setWord(nextWord);
    const timeout = window.setTimeout(() => setWord(null), 900 + Math.random() * 900);
    return () => clearTimeout(timeout);
  }, [phase, anomaly]);

  if (!word) return null;

  // Subliminal overlay is intentionally faint and short-lived to stay deniable.
  return <div className="subliminal" aria-hidden>{word}</div>;
};
