import { useMemo, useState } from 'react';

const SYMBOLS = ['🍒', '🍋', '⭐', '💎', '🍀'] as const;
const SPIN_COST = 6;

type SlotsGameProps = {
  money: number;
  onAdjustMoney: (delta: number, note?: string) => void;
  onExit: () => void;
};

const pickSymbol = () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];

const calculatePayout = (roll: (typeof SYMBOLS)[number][]) => {
  const uniqueCount = new Set(roll).size;

  if (uniqueCount === 1) {
    return roll[0] === '💎' ? 60 : 40; // Jackpot for triple, bonus for diamonds.
  }

  if (uniqueCount === 2) {
    return roll.includes('🍀') ? 18 : 12; // Pair with clover pays more.
  }

  if (roll.includes('🍀')) {
    return 4; // Consolation for seeing a clover at all.
  }

  return 0;
};

export const SlotsGame = ({ money, onAdjustMoney, onExit }: SlotsGameProps) => {
  const [roll, setRoll] = useState<(typeof SYMBOLS)[number][]>(['🍒', '🍋', '⭐']);
  const [outcome, setOutcome] = useState<string>('');

  const canSpin = money >= SPIN_COST;
  const rollDisplay = useMemo(() => roll.join('  '), [roll]);

  const spin = () => {
    if (!canSpin) {
      setOutcome('Liian vähän markkoja uuteen pyöräytykseen.');
      return;
    }

    const nextRoll = [pickSymbol(), pickSymbol(), pickSymbol()];
    const payout = calculatePayout(nextRoll);
    const net = payout - SPIN_COST;

    setRoll(nextRoll);

    if (payout > 0) {
      setOutcome(`Voitit ${payout} mk! (${nextRoll.join(' ')})`);
      onAdjustMoney(net, `Pajatso kilisi ja toi ${payout} mk.`);
    } else {
      setOutcome(`Ei voittoa. (${nextRoll.join(' ')})`);
      onAdjustMoney(net, 'Pajatso vei panoksesi.');
    }
  };

  return (
    <div className="slots-game">
      <p className="muted">
        "Ray Potti" hyrähtää. Panos {SPIN_COST} mk / pyöräytys. Taskussa {money} mk.
      </p>
      <div className="slots-reels" aria-label="Pajatson rullat">
        <span className="slots-window">{rollDisplay}</span>
      </div>
      <div className="slots-actions">
        <button className="choice" onClick={spin} disabled={!canSpin}>
          Pyöräytä
        </button>
        <button className="choice secondary" onClick={onExit}>
          Lopeta
        </button>
      </div>
      <div className="slots-status" aria-live="polite">
        {outcome || 'Pajatso odottaa seuraavaa kolikkoa.'}
      </div>
    </div>
  );
};
