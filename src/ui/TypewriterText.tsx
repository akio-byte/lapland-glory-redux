import { useEffect, useMemo, useState } from 'react';

type Props = {
  text: string;
  energy: number;
  className?: string;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const TypewriterText = ({ text, energy, className }: Props) => {
  const [visibleText, setVisibleText] = useState(text);

  const shouldAnimate = useMemo(() => text.length > 0 && text.length < 800, [text]);
  const energyLevel = useMemo(() => clamp(energy / 100, 0, 1), [energy]);

  useEffect(() => {
    if (!shouldAnimate) {
      setVisibleText(text);
      return;
    }

    // Reset to begin a fresh reveal whenever the text changes.
    setVisibleText('');

    const highEnergy = energyLevel >= 0.6;
    const lowEnergy = energyLevel <= 0.3;
    const baseDelay = highEnergy ? 14 : lowEnergy ? 60 : 30;
    const chunkSize = highEnergy ? 3 : 1;

    let index = 0;
    let timer: number | undefined;

    const step = () => {
      index = Math.min(index + chunkSize, text.length);
      setVisibleText(text.slice(0, index));

      if (index >= text.length) return;

      const loseFocusPause = lowEnergy && Math.random() < 0.2 ? 180 : 0;
      timer = window.setTimeout(step, baseDelay + loseFocusPause + Math.random() * 25);
    };

    timer = window.setTimeout(step, baseDelay);

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [text, shouldAnimate, energyLevel]);

  return <span className={className}>{visibleText}</span>;
};
